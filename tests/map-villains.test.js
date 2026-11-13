import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMapVillains} from '../src/map-villains.js';
test('old and malformed saves get five bounded hit counts',()=>{
 assert.deepEqual(normalizeMapVillains(null),[0,0,0,0,0]);
 assert.deepEqual(normalizeMapVillains([3,2,-1,4,'3',1]),[3,2,0,0,0]);
 assert.deepEqual(normalizeMapVillains(JSON.parse(JSON.stringify([0,1,2,3,0]))),[0,1,2,3,0]);
});

import {fresh,restore} from '../src/game-model.js';
test('save roundtrip, old saves, reset and preview copies preserve boundaries',()=>{const s=fresh();s.mapVillains=[3,2,1,0,0];assert.deepEqual(restore(JSON.stringify(s)).mapVillains,s.mapVillains);const copy=structuredClone(s);copy.mapVillains[0]=0;assert.equal(s.mapVillains[0],3);delete s.mapVillains;assert.deepEqual(restore(JSON.stringify(s)).mapVillains,[0,0,0,0,0]);assert.deepEqual(fresh().mapVillains,[0,0,0,0,0]);});
