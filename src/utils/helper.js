export const validateType = (value, type = 'string') => {
  if (typeof type === 'string')
    return (typeof value === type || (value && typeof value.$type === type))
  return (value instanceof type || (value && value.$type instanceof type))
}
