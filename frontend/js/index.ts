import * as R from 'ramda'
import { Grid } from 'gridjs'
import { hello2 } from './thing'

console.log(R.add(2, 2))

hello2()

const tasd = document.body

new Grid({
  columns: ['Name', 'Email', 'Phone Number'],
  data: [
    ['John', 'john@example.com', '(353) 01 222 3333'],
    ['Mark', 'mark@gmail.com', '(01) 22 888 4444'],
    ['Eoin', 'eoin@gmail.com', '0097 22 654 00033'],
    ['Sarah', 'sarahcdd@gmail.com', '+322 876 1233'],
    ['Afshin', 'afshin@mail.com', '(353) 22 87 8356'],
  ],
}).render(tasd)
