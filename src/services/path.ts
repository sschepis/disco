//

export default function path (p: any) {
  const pathParts = p
    .split('/')
    .filter((e: any) => e)
    .map((e: any) => e.trim())
  var node = this
  pathParts.forEach((p: any) => (node = node.get(p)))
  return node
}
