export type MarginProps = {
  mx?: number
  my?: number
  ml?: number
  mr?: number
  mt?: number
  mb?: number
}

export const marginStyle = <T extends object>(props: T & MarginProps) => {
  let styles = ''
  const { mx, my, ml, mr, mt, mb } = props as MarginProps

  if (mx !== undefined) {
    styles += `
        margin-left: ${mx}px; 
        margin-right: ${mx}px;
    `
  }

  if (my !== undefined) {
    styles += `
        margin-top: ${my}px;
        margin-bottom: ${my}px;
    `
  }

  if (ml !== undefined) {
    styles += `
        margin-left: ${ml}px;
    `
  }

  if (mr !== undefined) {
    styles += `
        margin-right: ${mr}px;    
    `
  }

  if (mt !== undefined) {
    styles += `
        margin-top: ${mt}px;
    `
  }

  if (mb !== undefined) {
    styles += `
        margin-bottom: ${mb}px;
    `
  }

  return styles
}

export type PaddingProps = {
  px?: number
  py?: number
  pl?: number
  pr?: number
  pt?: number
  pb?: number
}

export const paddingStyle = <T extends object>(props: T & PaddingProps) => {
  let styles = ''
  const { px, py, pl, pr, pt, pb } = props as PaddingProps

  if (px !== undefined) {
    styles += `
        padding-left: ${px}px; 
        padding-right: ${px}px;
    `
  }

  if (py !== undefined) {
    styles += `
        padding-top: ${py}px;
        padding-bottom: ${py}px;
    `
  }

  if (pl !== undefined) {
    styles += `
        padding-left: ${pl}px;
    `
  }

  if (pr !== undefined) {
    styles += `
        padding-right: ${pr}px;    
    `
  }

  if (pt !== undefined) {
    styles += `
        padding-top: ${pt}px;
    `
  }

  if (pb !== undefined) {
    styles += `
        padding-bottom: ${pb}px;
    `
  }

  return styles
}
