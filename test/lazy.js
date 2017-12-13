var Lazy = require('../dist/mingo').Lazy

function print(l) {
  console.log(l)
}

const data = [1,2,3,4,5,6,7,8,9]

var lazy = new Lazy(data).map(n => n*3).filter(n => n%2 == 0).reverse()
print(lazy.next())
print(lazy.all())
print(lazy.next())
print(lazy.all())

// lazy = new Lazy(data).map(n => n*3).filter(n => n%2 == 0).reduce((acc, n) => acc + n, 0)
// print(lazy.all())

// lazy = new Lazy(data).map(n => n*2).take(5).reverse().take(2)
// print(lazy.all())
