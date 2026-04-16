import styled from 'styled-components'

export const MenuContainer = styled.div`
  border-radius: 12px;
  padding: 15px 16px 14px 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1);
  margin: 14px 0;
  border: 1px solid #e5e7eb;
`

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`
export const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
`

export const Text = styled.p`
  font-size: 12px;
  font-weight: 400;
  margin-top: 8px;
  text-align: center;
`
