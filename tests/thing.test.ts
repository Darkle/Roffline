import { expect } from 'chai'

describe('Array', function () {
  describe('#indexOf()', function () {
    this.timeout(5000)
    it('should return -1 when the value is not present', function () {
      expect([1, 2, 3].indexOf(4)).to.equal(-1)
    })
  })
})
