import styled from 'styled-components'

export const LoadingContainer = styled.div<{ fullHeight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ fullHeight }) => (fullHeight ? '100vh' : 'auto')};
`

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid #ccc;
  border-radius: 50%;
  border-top-color: #000;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`
