import { describe, expect, it } from 'vitest'
import { sum } from '../src'

describe('sum', () => {
  it('should return the correct sum of two numbers', () => {
    expect(sum(1, 1)).toEqual(2)
  })
})
