// curry 函数接受一个函数 fn 作为参数，表示要进行柯里化的原函数。
function curry(fn) {
       // 在 curry 函数内部，定义一个内部函数 curried，用于处理传入的参数。
       return function curried(...args) {
              // 检查传入的参数个数 args.length 是否达到了原函数的参数个数 fn.length。
              // 如果传入的参数个数达到了原函数的参数个数，则直接调用原函数 fn，并传入参数 ...args，然后返回结果。
              if (args.length >= fn.length) {
                     return fn(...args);
              } else {
                     // 如果传入的参数个数还不够，说明还需要继续接收参数，此时返回一个新的函数，使用 ...args 将已经接收的参数保存起来，然后再继续接收剩余的参数。
                     return function (...moreArgs) {
                            // 新的函数内部会递归调用 curried 函数，并传入已接收的参数 ...args 和剩余的参数 ...moreArgs，以实现逐步接收参数的效果。
                            return curried(...args, ...moreArgs);
                     };
              }
       };
}
     