// This is a workaround for JSON.stringify not supporting BigInt
// @ts-ignore
BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString())
  return int ?? this.toString()
}
