#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
價值雷達 ValueRadar TW — 每日資料更新管線（GitHub Actions 用）

資料來源（全部免費、公開）：
  上市：TWSE openapi（行情 / 本益比殖利率淨值比 / 月營收 / 基本資料）
  上櫃：TPEx openapi（部分網路環境會擋）→ 失敗時自動改用 FinMind 免費 API
  個股日K：HiStock chartdata（未還原權值 → 本腳本自動偵測分割/減資斷點並調整）

設計原則：
  - 單一來源失敗不會讓整次更新失敗：缺什麼就沿用前一天的 stocks.json 欄位
  - 直接讀寫 public/data/stocks.json，前端無需修改

執行：python pipeline/update_data.py
"""
import json
import os
import statistics
import sys
import time
from datetime import datetime, timezone, timedelta

import requests

UA = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/plain,*/*',
}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEMES_PATH = os.path.join(ROOT, 'pipeline', 'themes.json')
STOCKS_PATH = os.path.join(ROOT, 'public', 'data', 'stocks.json')
HIST_M = 'dailyk,close,volume,mean20,mean60,mean5volume,mean20volume'
TW = timezone(timedelta(hours=8))


def f(x):
    """寬容的 float 轉換"""
    try:
        s = str(x).replace(',', '').replace('+', '').replace('%', '').strip()
        if s in ('', '--', 'None', 'null', 'N/A'):
            return None
        return float(s)
    except Exception:
        return None


def get_json(url, headers=None, timeout=30):
    r = requests.get(url, headers=headers or UA, timeout=timeout)
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------- TWSE（上市）
def fetch_twse():
    """回傳 (quotes, valuation, revenue, basic) dict by code；失敗回傳空 dict"""
    base = 'https://openapi.twse.com.tw/v1'
    out = {'quote': {}, 'val': {}, 'rev': {}, 'basic': {}}
    try:
        for row in get_json(f'{base}/exchangeReport/STOCK_DAY_ALL'):
            c = str(row.get('Code', '')).strip()
            if c:
                out['quote'][c] = row
    except Exception as e:
        print(f'[warn] TWSE 行情失敗: {e}')
    try:
        for row in get_json(f'{base}/exchangeReport/BWIBBU_ALL'):
            c = str(row.get('Code', '')).strip()
            if c:
                out['val'][c] = row
    except Exception as e:
        print(f'[warn] TWSE 估值失敗: {e}')
    try:
        for row in get_json(f'{base}/opendata/t187ap05_L'):
            c = str(row.get('公司代號', '')).strip()
            if c:
                out['rev'][c] = row
    except Exception as e:
        print(f'[warn] TWSE 月營收失敗: {e}')
    try:
        for row in get_json(f'{base}/opendata/t187ap03_L'):
            c = str(row.get('公司代號', '')).strip()
            if c:
                out['basic'][c] = row
    except Exception as e:
        print(f'[warn] TWSE 基本資料失敗: {e}')
    return out


# ---------------------------------------------------------------- TPEx（上櫃）
def fetch_tpex():
    """回傳 (quote, val, rev, basic) dict by code；被擋時回傳 None"""
    try:
        q = get_json('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes')
        basic = get_json('https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O')
        rev = get_json('https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O')
        # 估值（本益比/殖利率/淨值比）web CSV，cp950
        r = requests.get(
            'https://www.tpex.org.tw/web/stock/aftertrading/peratio_analysis/pera_result.php',
            params={'l': 'zh-tw', 'o': 'csv'}, headers=UA, timeout=30)
        r.raise_for_status()
        import csv as _csv, io as _io
        text = r.content.decode('cp950', errors='replace')
        val = {}
        for row in _csv.reader(_io.StringIO(text)):
            if len(row) >= 6 and row[0].strip().isdigit():
                val[row[0].strip()] = {
                    'name': row[1].strip(), 'per': f(row[2]),
                    'yield': f(row[4]), 'pbr': f(row[5]),
                }
        quote = {str(r_['SecuritiesCompanyCode']).strip(): r_ for r_ in q}
        basic_d = {str(r_.get('公司代號', '')).strip(): r_ for r_ in basic}
        rev_d = {str(r_.get('公司代號', '')).strip(): r_ for r_ in rev}
        print(f'[ok] TPEx 官方資料取得成功（{len(quote)} 檔報價）')
        return {'quote': quote, 'val': val, 'rev': rev_d, 'basic': basic_d}
    except Exception as e:
        print(f'[warn] TPEx 官方來源失敗（{type(e).__name__}），改用 FinMind')
        return None


def fetch_finmind_valuation(codes):
    """FinMind 免費 API：全市場 PER/PBR/殖利率（涵蓋上櫃）。回傳 {code: {per,pbr,yield}}"""
    out = {}
    try:
        r = requests.get('https://api.finmindtrade.com/api/v4/data',
                         params={'dataset': 'TaiwanStockPER',
                                 'start_date': (datetime.now(TW) - timedelta(days=10)).strftime('%Y-%m-%d')},
                         headers=UA, timeout=60)
        rows = r.json().get('data', [])
        # 每檔取最新一筆
        for row in rows:
            c = str(row.get('stock_id', ''))
            if c in codes:
                out[c] = {'per': f(row.get('PER')), 'pbr': f(row.get('PBR')),
                          'yield': f(row.get('dividend_yield'))}
        print(f'[ok] FinMind 估值取得成功（{len(out)} 檔）')
    except Exception as e:
        print(f'[warn] FinMind 估值失敗: {e}')
    return out


# ---------------------------------------------------------------- HiStock 日K
def fetch_histock(code, days=370):
    u = f'https://histock.tw/stock/chip/chartdata.aspx?no={code}&days={days}&m={HIST_M}'
    h = {**UA, 'Referer': f'https://histock.tw/stock/{code}'}
    d = get_json(u, h, 20)
    if not d or 'DailyK' not in d:
        raise ValueError('empty')
    def parse(key):
        v = d.get(key)
        if isinstance(v, str):
            v = json.loads(v)
        return v or []
    dailyk = parse('DailyK')      # [[ts_ms, o, h, l, c], ...]
    vols = parse('Volume')        # [[ts_ms, v], ...]
    if not dailyk or not vols:
        raise ValueError('no data')
    vol_by_ts = {int(p[0]): f(p[1]) for p in vols}
    dates, closes, highs, volumes = [], [], [], []
    for bar in dailyk:
        ts = int(bar[0])
        dates.append(datetime.fromtimestamp(ts / 1000, TW).strftime('%Y-%m-%d'))
        highs.append(f(bar[2]))
        closes.append(f(bar[4]))
        volumes.append(vol_by_ts.get(ts, 0) or 0)
    return dates, closes, highs, volumes


def adjust_splits(closes, highs, vols):
    """偵測分割/減資斷點（台股漲跌幅上限 10%，單日 |變化|>45% 必為事件）並回推調整"""
    for i in range(1, len(closes)):
        if not closes[i] or not closes[i - 1]:
            continue
        ratio = closes[i] / closes[i - 1]
        if ratio > 1.45 or ratio < 0.65:
            for j in range(i):
                closes[j] *= ratio
                if highs[j]:
                    highs[j] *= ratio
                vols[j] = vols[j] / ratio if ratio else vols[j]
    return closes, highs, vols


def sma_last(vals, n):
    xs = [v for v in vals[-n:] if v is not None]
    return round(sum(xs) / len(xs), 2) if xs else None


# ---------------------------------------------------------------- 主流程
def main():
    themes = json.load(open(THEMES_PATH, encoding='utf-8'))
    theme_map = {}   # code -> [{id, purity}]
    for t in themes:
        for s in t['stocks']:
            theme_map.setdefault(s['code'], []).append({'id': t['id'], 'purity': s['purity']})
    codes = sorted(theme_map.keys())
    print(f'股票池：{len(codes)} 檔')

    prev = {}
    if os.path.exists(STOCKS_PATH):
        try:
            prev = {s['code']: s for s in json.load(open(STOCKS_PATH, encoding='utf-8'))['stocks']}
            print(f'已載入前次資料 {len(prev)} 檔（失敗時沿用）')
        except Exception as e:
            print(f'[warn] 前次 stocks.json 讀取失敗: {e}')

    twse = fetch_twse()
    tpex = fetch_tpex()
    finmind_val = {}
    if tpex is None:
        time.sleep(1)
        finmind_val = fetch_finmind_valuation(set(codes))

    stocks_out = []
    latest_date = None
    for i, code in enumerate(codes):
        old = prev.get(code, {})
        is_listed = code in twse['quote'] or (old.get('market') == 'TW')
        market = 'TW' if is_listed else 'TPEx'

        # ---- 基本面：官方優先，FinMind 備援，再沿用舊值 ----
        name = old.get('name', code)
        industry = old.get('industry')
        per = pbr = div_yield = rev_yoy = None

        if market == 'TW':
            b = twse['basic'].get(code, {})
            name = b.get('公司簡稱') or name
            industry = b.get('產業別') or industry
            v = twse['val'].get(code, {})
            per, div_yield, pbr = f(v.get('PEratio')), f(v.get('DividendYield')), f(v.get('PBratio'))
            rv = twse['rev'].get(code, {})
            rev_yoy = f(rv.get('營業收入-去年同月增減(%)'))
        else:
            if tpex:
                b = tpex['basic'].get(code, {})
                name = b.get('公司簡稱') or name
                industry = b.get('產業別') or industry
                v = tpex['val'].get(code, {})
                per, div_yield, pbr = v.get('per'), v.get('yield'), v.get('pbr')
                rv = tpex['rev'].get(code, {})
                rev_yoy = f(rv.get('營業收入-去年同月增減(%)'))
                if not industry:
                    industry = rv.get('產業別') or industry
            if per is None and code in finmind_val:
                v = finmind_val[code]
                per, pbr, div_yield = v['per'], v['pbr'], v['yield']

        # 沿用舊值補缺
        per = per if per is not None else old.get('per')
        pbr = pbr if pbr is not None else old.get('pbr')
        div_yield = div_yield if div_yield is not None else old.get('div_yield')
        rev_yoy = rev_yoy if rev_yoy is not None else old.get('rev_yoy')
        if rev_yoy is not None:
            rev_yoy = round(rev_yoy, 1)

        # ---- 價量歷史（HiStock）----
        try:
            dates, closes, highs, vols = fetch_histock(code)
            closes, highs, vols = adjust_splits(closes, highs, vols)
            time.sleep(0.4)
        except Exception as e:
            print(f'[warn] {code} {name} 日K失敗（{e}）→ 沿用前次')
            if old:
                stocks_out.append(old)
            continue

        price = closes[-1]
        change_pct = round((closes[-1] / closes[-2] - 1) * 100, 2) if len(closes) >= 2 and closes[-2] else None
        ma20, ma60 = sma_last(closes, 20), sma_last(closes, 60)
        avg20, avg60 = sma_last(vols, 20), sma_last(vols, 60)
        vol_ratio = round(avg20 / avg60, 2) if avg20 and avg60 else None
        ret20 = round((closes[-1] / closes[-21] - 1) * 100, 1) if len(closes) > 21 and closes[-21] else None
        ret60 = round((closes[-1] / closes[-61] - 1) * 100, 1) if len(closes) > 61 and closes[-61] else None
        high_52w = round(max([h for h in highs if h] or [0]), 2) or None
        pct_from_high = round((price / high_52w - 1) * 100, 1) if high_52w else None
        latest_date = max(latest_date or '', dates[-1])

        stocks_out.append({
            'code': code, 'name': name, 'market': market,
            'industry': industry or old.get('industry') or '其他',
            'themes': theme_map[code],
            'price': round(price, 2), 'change_pct': change_pct,
            'per': per, 'pbr': pbr, 'div_yield': div_yield, 'rev_yoy': rev_yoy,
            'ma20': ma20, 'ma60': ma60, 'vol_ratio': vol_ratio,
            'ret20': ret20, 'ret60': ret60,
            'high_52w': high_52w, 'pct_from_high': pct_from_high,
            'avg_vol_20': avg20, 'avg_vol_60': avg60,
            'history': {'dates': dates[-120:], 'close': [round(c, 2) for c in closes[-120:]],
                        'volume': [round(v) for v in vols[-120:]]},
        })
        print(f'[{i + 1}/{len(codes)}] {code} {name} 收 {price}')

    # ---- 產業 PER 中位數 ----
    by_ind = {}
    for s in stocks_out:
        if s['per'] and s['per'] > 0:
            by_ind.setdefault(s['industry'], []).append(s['per'])
    pool_all = [p for ps in by_ind.values() for p in ps]
    pool_med = round(statistics.median(pool_all), 1) if pool_all else None
    ind_median = {k: round(statistics.median(v), 1) for k, v in by_ind.items() if len(v) >= 2}
    for s in stocks_out:
        s['industry_per_median'] = ind_median.get(s['industry'], pool_med)

    payload = {
        'as_of': latest_date or datetime.now(TW).strftime('%Y-%m-%d'),
        'generated_at': datetime.now(TW).isoformat(timespec='seconds'),
        'sources': ['TWSE 證券交易所公開資料', 'TPEx 櫃買中心公開資料', 'FinMind',
                    '公開資訊觀測站月營收', 'HiStock 日K線'],
        'industry_per_median': ind_median,
        'stocks': stocks_out,
    }
    with open(STOCKS_PATH, 'w', encoding='utf-8') as fp:
        json.dump(payload, fp, ensure_ascii=False, separators=(',', ':'))
    print(f'\n完成：{len(stocks_out)} 檔寫入 {STOCKS_PATH}（as_of={payload["as_of"]}）')
    if len(stocks_out) < len(codes) * 0.8:
        print('[error] 成功更新檔數過少，保留失敗以保留舊資料', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
