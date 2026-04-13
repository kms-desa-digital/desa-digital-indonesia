import styled from 'styled-components'

export const Container = styled.div`
  border: 1px solid #e5e7eb;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  border-radius: 8px;
  min-width: 156px;
  max-width: 156px;
  overflow: hidden;
  cursor: pointer;
  height: 100%;
  min-height: 244px;
`

export const Background = styled.img`
  height: 100px;
  width: 100%;
  object-fit: cover;
`

export const Content = styled.div`
  padding: 8px;
  height: 100%;
  max-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

export const Title = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: black;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`

export const Category = styled.p`
  font-size: 10px;
  font-weight: 400;
  color: #374151;
  margin: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Description = styled.p`
  font-size: 10px;
  font-weight: 400;
  color: #9ca3af;
  white-space: wrap;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-self: stretch;
  text-overflow: ellipsis;
`

export const Icon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
`
export const Company = styled.p`
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
`

export const Applied = styled.p`
  margin-top: 8px;
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
`
export const CompanyContainer = styled.div`
  display: flex;
  margin-top: 10px;
  margin-bottom: 4px;
  gap: 8px;
`
export const InnovatorName = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #4B5563;
  margin-left: 2px;
  align-self: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
`;