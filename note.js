// const readline = require('readline');
// const rl = readline.createInterface({
//    input: process.stdin,
//    output: process.stdout
// });
// rl.on('line', function(data){
//    console.log(data);
// })
const a = 6;
const b = [false, true, false, false, false, false, false, false, false];

function f(a,b){
  // 求出a的前后整数
  let before_a=parseInt(a);
  let after_a=Math.ceil(a);
  console.log(before_a,after_a)

  let left=before_a;
  let right=after_a;

  // 同时移动双指针
  while(!b[left] && !b[right]){

      // if(b[left]){
      //   return left;
      // }
      // if(b[right]){
      //   return right;
      // }
      
      console.log('left',left,b[left]);
      console.log('right',right,b[right]);
      left-=1;
      right+=1;
  }

  let res;
  if(b[right]){
      res=right
  }else{
      res=left;
  }

  return res;

}

console.log(f(a,b));

// while(!b[left]){
//     left-=1;
// }

// while(!b[right]){
//     right+=1;
// }





