import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  formatNumber,
  formatPercent,
  formatMarketCap,
  formatVolume,
} from './format';

test('formatRupiah memberi pemisah ribuan', () => {
  assert.equal(formatRupiah(7466), 'Rp 7.466');
  assert.equal(formatRupiah(1234567), 'Rp 1.234.567');
  assert.equal(formatRupiah(50), 'Rp 50');
});

test('formatNumber dengan desimal memakai koma', () => {
  assert.equal(formatNumber(1234.5, 1), '1.234,5');
  assert.equal(formatNumber(-2000), '-2.000');
});

test('formatPercent memberi tanda', () => {
  assert.equal(formatPercent(2.27), '+2,27%');
  assert.equal(formatPercent(-1.73), '-1,73%');
  assert.equal(formatPercent(0), '0,00%');
});

test('formatMarketCap meringkas triliun & miliar', () => {
  assert.equal(formatMarketCap(980_000_000_000_000), 'Rp 980,0 T');
  assert.equal(formatMarketCap(5_200_000_000_000), 'Rp 5,2 T');
  assert.equal(formatMarketCap(1_200_000_000), 'Rp 1,2 M');
});

test('formatVolume meringkas juta & ribu', () => {
  assert.equal(formatVolume(16_225_535), '16,2 jt');
  assert.equal(formatVolume(5_400), '5,4 rb');
});
