'use strict';
const {spawn}=require('node:child_process'),path=require('node:path');
Promise.all([0,1,2,3].map(shard=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(__dirname,'run_complex.cjs'),'--shard='+shard,'--shards=4'],{stdio:'inherit',env:process.env});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Complex shard '+shard+' failed with code '+code)));}))).catch(error=>{console.error(error.message);process.exitCode=1;});
