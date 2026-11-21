'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('invoice uses the billed HSN slab and tax amount', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 2 }];
  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, tax: invoiceFigures.tax, total: invoiceFigures.total },
    { subtotal: billed.subtotal, tax: billed.tax, total: billed.total }
  );
  assert.equal(invoiceFigures.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(invoiceFigures.rows[0].lineTax, billed.lines[0].tax);
});

test('invoice uses the billed coupon cap, post-discount GST, and total', function () {
  var items = [{ id: 2, name: 'Tea', sku: 'TEA-1', hsn: '0902', price: 2000, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var order = {
    items: items,
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    }
  );
  assert.equal(invoiceFigures.rows[0].lineTax, billed.lines[0].tax);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
