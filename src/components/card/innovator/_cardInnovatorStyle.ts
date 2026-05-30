import styled from 'styled-components'

export const Container = styled.div`
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 130px;
  overflow: hidden;
  cursor: pointer;
`

export const Background = styled.img`
  height: 64px;
  width: 100%;
  object-fit: cover;
`
export const Logo = styled.img`
  height: 50px;
  width: 50px;
  border-radius: 50%;
  object-fit: cover;
  position: absolute;
  top: -30px;
`

export const CardContent = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  align-item: flex-start;
  flex: 1 0 0;
  align-self: stretch;
  height: 130px;
`
export const ContBadge = styled.div`
  display: flex;
  width: 100%;
  height: 21px;
  gap: 10 px;
  align-items: center;
  justify-content: flex-end;
  padding: 8px;

`

export const Title = styled.p.withConfig({
  shouldForwardProp: (prop) => prop !== '$hasBadge'
})<{ $hasBadge?: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: #1F2937;
  height: ${({ $hasBadge }) => ($hasBadge ? '17px' : '34px')};
  line-height: 17px;
  
  white-space: wrap;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ $hasBadge }) => ($hasBadge ? 1 : 2)};
  align-self: stretch;
  text-overflow: ellipsis;
`

export const Description = styled.p`
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
`
