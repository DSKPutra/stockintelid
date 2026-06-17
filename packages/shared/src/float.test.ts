import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStrategicHolder,
  computeFreeFloat,
  freeFloatRisk,
  HolderClassification,
} from './float';

function h(p: Partial<HolderClassification>): HolderClassification {
  return {
    holderName: 'X',
    holderType: 'Individual',
    isController: false,
    groupId: null,
    pct: 0,
    ...p,
  };
}

test('isStrategicHolder: korporasi & pengendali = strategis', () => {
  assert.equal(isStrategicHolder(h({ holderType: 'Corporate' })), true);
  assert.equal(isStrategicHolder(h({ isController: true, holderType: 'Individual' })), true);
  assert.equal(isStrategicHolder(h({ holderType: 'Government' })), true);
});

test('isStrategicHolder: portfolio & ritel = free float', () => {
  assert.equal(isStrategicHolder(h({ holderType: 'Mutual Fund' })), false);
  assert.equal(isStrategicHolder(h({ holderType: 'Insurance' })), false);
  assert.equal(isStrategicHolder(h({ holderName: 'Masyarakat (< 5%)', holderType: 'Corporate' })), false);
});

test('isStrategicHolder: individu terafiliasi grup = strategis, non-afiliasi = free float', () => {
  assert.equal(isStrategicHolder(h({ holderType: 'Individual', groupId: 'barito' })), true);
  assert.equal(isStrategicHolder(h({ holderType: 'Individual', groupId: null })), false);
});

test('computeFreeFloat: hitung strategis vs free float + risiko', () => {
  const holders: HolderClassification[] = [
    h({ holderName: 'PT Induk', holderType: 'Corporate', isController: true, pct: 64.5 }),
    h({ holderName: 'Pendiri', holderType: 'Individual', groupId: 'barito', pct: 12.3 }),
    h({ holderName: 'Masyarakat', holderType: 'Corporate', pct: 23.2 }),
  ];
  const r = computeFreeFloat(holders);
  assert.equal(r.strategicPct, 76.8);
  assert.equal(r.freeFloatPct, 23.2);
  assert.equal(r.topHolder, 'PT Induk');
  assert.equal(r.riskLevel, 'Medium'); // 20..40
});

test('freeFloatRisk: ambang batas', () => {
  assert.equal(freeFloatRisk(10), 'High');
  assert.equal(freeFloatRisk(30), 'Medium');
  assert.equal(freeFloatRisk(55), 'Low');
});

test('computeFreeFloat: top holders > 1% terurut menurun', () => {
  const holders: HolderClassification[] = [
    h({ holderName: 'A', pct: 0.8, holderType: 'Mutual Fund' }),
    h({ holderName: 'B', pct: 5.2, holderType: 'Mutual Fund' }),
    h({ holderName: 'C', pct: 30, holderType: 'Corporate' }),
  ];
  const r = computeFreeFloat(holders);
  assert.deepEqual(
    r.topHoldersAbove1.map((x) => x.holderName),
    ['C', 'B'],
  );
});
