import styled from 'styled-components';

export const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isHome'
}) <{ $isHome?: boolean }>`
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  width: 100%;
  flex-shrink: 0;
  height: ${({ $isHome }) => ($isHome ? '225px' : '197px')};
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  cursor: pointer;
`;

export const Background = styled.img`
  height: 64px;
  width: 100%;
  object-fit: cover;
`;

export const Logo = styled.img`
  height: 50px;
  width: 50px;
  border-radius: 50%;
  object-fit: cover;
  position: absolute;
  top: -25px;
`;

export const CardContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isHome'
})<{ $isHome?: boolean }>`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: ${({ $isHome }) => ($isHome ? '4px' : '2px')};
  position: relative;
  align-items: flex-start;
  flex: 1 0 0;
  align-self: stretch;
`;

export const ContBadge = styled.div`
  display: flex;
  width: 100%;
  height: 21px;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  padding: 8px;
`;

export const Title = styled.p.withConfig({
  shouldForwardProp: (prop) => prop !== '$isHome'
})<{ $isHome?: boolean }>`
  font-size: ${({ $isHome }) => ($isHome ? '12px' : '10px')};
  font-weight: 700;
  color: #1f2937;
  line-height: 140%;
  height: ${({ $isHome }) => ($isHome ? '34px' : '28px')};
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-self: stretch;
  text-overflow: ellipsis;
`;

export const Description = styled.p`
  font-size: 10px;
  font-weight: 400;
  color: #4b5563;
  white-space: wrap;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-self: stretch;
  text-overflow: ellipsis;
`;

export const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: auto;
  width: 100%;
`;
