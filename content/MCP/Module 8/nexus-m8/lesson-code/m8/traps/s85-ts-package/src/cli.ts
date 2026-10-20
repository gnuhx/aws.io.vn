#!/usr/bin/env node
// BẪY S8.5 · 1 — publish nguyên .ts vì "Node 22 chạy .ts được". Chạy trong repo thì được; cài qua npm thì file nằm trong
// node_modules, mà Node KHÔNG strip type cho file trong node_modules.
const greeting: string = "xin chào từ .ts";
console.log(greeting);
