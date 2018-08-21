export const validateType = (value, type = 'string') => {
  if (type === 'string') { return (typeof value === 'string' || (value && typeof value.$type === 'string')) }
  return (value instanceof type || (value && value.$type instanceof type))
}
