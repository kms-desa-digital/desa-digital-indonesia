import styled from 'styled-components'
import Readiness from '@public/images/readiness2-background.jpg'

export const Background = styled.div`
  background-image: url(${Readiness.src});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding: 12px;
  border-radius: 12px;
  min-height: 154px;
`

export const Text = styled.p`
  font-size: 16px;
  color: #374151;
  font-weight: 700;
  margin-bottom: 8px;
`