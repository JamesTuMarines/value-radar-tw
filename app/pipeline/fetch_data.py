#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台股低估題材股篩選工具 — 資料管線
資料來源（全部官方/公開）：
  - TWSE openapi: STOCK_DAY_ALL(行情) / BWIBBU_ALL(本益比殖利率淨值比) / t187ap05_L(月營收+產業別)
  - TPEx: openapi tpex_mainboard_quotes / mopsfin_t187ap05_O(月營收) / web API pera_result.php?o=csv(本益比殖利率淨值比)
  - HiStock chartdata.aspx: 個股日K OHLCV（250交易日）— 注意：未還原權值，本管線自動偵測分割/減資斷點(>45%)並調整
產出：public/data/stocks.json（原始指標，評分由前端依 design/scoring-spec.md 即時計算）
"""
import requests, json, csv, io, re, time, statistics
from datetime import datetime
from collections import defaultdict

UA = {'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36'}
BASE = 'https://openapi.twse.com.tw/v1'
HIST_M = 'dailyk,close,volume,mean20,mean60,mean5volume,mean20volume'

def f(x):
    try: return float(str(x).replace(',','').replace('+','').strip())
    except: return None

def fetch_twse():
    q  = requests.get(f'{BASE}/exchangeReport/STOCK_DAY_ALL', headers=UA, timeout=30).json()
    v  = requests.get(f'{BASE}/exchangeReport/BWIBBU_ALL', headers=UA, timeout=30).json()
    rv = requests.get(f'{BASE}/opendata/t187ap05_L', headers=UA, timeout=30).json()
    return q, v, rv

# TPEx 需經瀏覽器管道（Cloudflare 擋 requests）：下載後讀檔
#   tpex_mainboard_quotes -> JSON ; mopsfin_t187ap05_O -> JSON ; pera_result.php?o=csv -> cp950 CSV

def fetch_histock(code, days=370):
    u = f'https://histock.tw/stock/chip/chartdata.aspx?no={code}&days={days}&m={HIST_M}'
    r = requests.get(u, headers={**UA,'Referer':f'https://histock.tw/stock/{code}'}, timeout=20)
    return r.json()

def adjust_splits(dates, closes, highs, vols):
    for i in range(1, len(closes)):
        ratio = closes[i]/closes[i-1]
        if ratio > 1.45 or ratio < 0.65:      # 台股漲跌幅上限10%，超限即分割/減資斷點
            for j in range(i):
                closes[j] *= ratio; highs[j] *= ratio; vols[j] /= ratio
    return dates, closes, highs, vols
