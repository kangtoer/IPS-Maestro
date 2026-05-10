import fs from 'fs';

async function run() {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('dummy pdf')]), 'test.pdf');
  const res = await fetch('http://localhost:3000/api/upload-document', {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text.substring(0, 100));
}
run();
