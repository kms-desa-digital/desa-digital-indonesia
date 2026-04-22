import styled from 'styled-components'

export const CardContainer = styled.div`
  width: 100%;
  overflow: visible;
`

export const Horizontal = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;  /* IE dan Edge lama */
  scrollbar-width: none;     /* Firefox */
  &::-webkit-scrollbar {
    display: none;            /* Chrome, Safari, Edge */
  }
  padding-bottom: 4px;
  width: 100%;
`

export const Title = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: black;
  margin: 24px 0 8px 0;
  color:"#1F2937");
`
