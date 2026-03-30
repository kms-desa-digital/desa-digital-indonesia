import styled from "styled-components";
import { marginStyle, MarginProps } from "Consts/sizing";

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px;
  heigh: 100%;
  
`;

export const Title = styled.p`
  font-size: 18px;
  font-weight: 700;
  margin-top: 40px;
  position: relative;
  color: #1F2937;
`;
export const TagContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 4px 8px;
  width: 150px;
  height: 25px;
  background: #e5e7eb;
  border-radius: 20px;
  font-weight: 400;
  margin-left: 16px;
`;

export const Label = styled.p<MarginProps>`
  font-style: normal;
  padding: 4px 8px;
  background: #E5E7EB;
  border-radius: 20px;
  font-weight: 400;
  font-size: 12px;
  color: #4b5563;
  text-align: justify;
  width: fit-content;
  cursor: pointer;
  ${marginStyle}
`;
export const Description = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 140%;
  color: #4b5563;
  gap: 6px;
  text-align: justify;
`;
export const ActionContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 10px;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.10);
`;

export const Icon = styled.img<MarginProps>`
  cursor: pointer;
  position: flex;
  justify-content: space-between;
  border-radius: 0px;
  ${marginStyle}
`;

export const Text = styled.p`
  position: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
  color: #1F2937;
`;

export const Background = styled.img`
  width: 100%;
  max-width: 360px;
  height: 150px;
  margin-top: 0px;
  margin: 0; /* Hapus margin */
  padding: 0; /* Pastikan tidak ada padding */
  object-fit: cover; /* Menjamin gambar menempel */
`;

export const Logo = styled.img`
  width: 80px;
  height: 80px;
  margin-left: 16px;
  margin-right: 16px;
  margin-top: -40px;
  margin-bottom: -40px;
  border-radius: 50%;
  object-fit: cover;
  position: absolute;
  bottom: 0;
  left: 0;
  border: 0;
  align-content: center;
`;

export const ChipContainer = styled.div`
  display: flex;
  gap: 0px;
  align-items: center;
`;

export const Img = styled.img`
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
`;

export const ContPotensiDesa = styled.div`
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  gap: 8px;
  align-self: stretch;
  flex-wrap: wrap;
`;

export const ButtonKontak = styled.div`
display: flex;
width: 100%;
padding: 12px 16px;
align-items: center;
gap: 16px;
margin-top: 12px;
border-radius: 10px;
border: 1px solid var(--Gray-40, #D1D5DB);
background: var(--Monochrome-White, #FFF);
box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.10);
`;