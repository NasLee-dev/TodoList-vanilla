export const sanitizeHtml = (str: string): string => {
  const div = document.createElement('div')
  div.innerText = str
  return div.innerHTML
}
