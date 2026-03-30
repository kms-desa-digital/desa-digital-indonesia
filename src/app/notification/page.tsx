"use client";

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import Container from "Components/container";
import TopBar from "Components/topBar";
import {
    Content, Date,
    Description,
    NotifContainer, Title
} from "./_styles";

function Notification() {

    return (
        <Container page>
            <TopBar title="Notifikasi" />
            <Tabs variant='soft-rounded' colorScheme='green' mt={7} align="center" >
                <TabList style={{ gap: "8px", display: "flex", flexDirection: "row" }}>
                    <Tab height="32px" width="160px" borderColor="#BBF7D0" backgroundColor="#F0FDF4" borderWidth={1} fontWeight="medium" fontSize="14px" >Umum</Tab>
                    <Tab height="32px" width="160px" borderColor="#BBF7D0" backgroundColor="#F0FDF4" borderWidth={1} fontWeight="medium" fontSize="14px">Pengajuan anda</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel padding="16px 16px" gap="8px" display="flex" flexDirection="column" >
                        <NotifContainer>
                            <Content>
                                <Title>Aruna Hadir Disini!</Title>
                                <Description>Aruna baru saja terdaftar di KMS Desa Digital Indonesia. Ayo cari tau inovasinya dan terapkan di desamu.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Ada yang Baru dari Efishery!</Title>
                                <Description>Efishery baru saja menambahkan inovasi baru, yaitu Pakan Otomatis Efeeder. Ayo cari inovasinya dan terapkan di desamu.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Selamat kepada Desa Soge!</Title>
                                <Description>Desa Soge kini menerapkan inovasi baru dari efishery, yaitu Pakan Otomatis Efeeder. Semoga inovasi yang diterapkan memberi manfaat besar bagi desa dan bisa menjadi desa cerdas.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Desa Terbaik 3 Bulan Ini</Title>
                                <Description>3 Bulan ini, Desa Soge menduduki peringkat pertama dalam peringkat penerapan inovasi. Diikuti oleh Desa A dan Desa B. Ayo terus terapkan inovasi di desamu dan raih peringkat!</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Inovator Terfavorit 3 Bulan Ini</Title>
                                <Description>3 Bulan ini, efishery menduduki peringkat pertama dalam peringkat inovator terfavorit. Diikuti oleh Inovator A dan Inovator B. Ayo raih pengguna dan jadi inovator tervaforit!</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                    </TabPanel>
                    <TabPanel padding="16px 16px" gap="8px" display="flex" flexDirection="column" >
                        <NotifContainer>
                            <Content>
                                <Title>Pengajuan Klaim Penerapan Inovasi Ditolak</Title>
                                <Description>Selamat! Pengajuan klaim inovasi pakan otomatis efisheery sudah diverifikasi. Jumlah inovasi di desa Anda bertambah. Silahkan cek pada profil.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Pengajuan Klaim Penerapan Inovasi Ditolak</Title>
                                <Description>Pengajuan klaim inovasi ditolak dengan catatan :  Data kurang detail. Silahkan masukkan data lebih detail. Silahkan ajukan kembali klaim inovasi.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Profil Desa Terverifikasi</Title>
                                <Description>Selamat! Profil desa telah diverifikasi. Sekarang akun ini sudah dapat mengklaim penerapan inovasi. Silahkan cek profil akun anda pada halaman profil.</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                        <NotifContainer>
                            <Content>
                                <Title>Profil Desa Ditolak</Title>
                                <Description>Profil desa ditolak dengan catatan :  informasi akun kurang jelas. Silahkan edit pendaftaran profil dan ajukan ulang</Description>
                                <Date>12/10/24</Date>
                            </Content>
                        </NotifContainer>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container >
    )
}
export default Notification;
