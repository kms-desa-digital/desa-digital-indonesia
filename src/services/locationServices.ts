// locationServices.ts
interface Location {
  id: string;
  name: string;
}

const BASE_LOCATION_URL = "https://www.emsifa.com/api-wilayah-indonesia";

export const getProvinces = async (): Promise<Location[]> => {
  try {
    const response = await fetch(`${BASE_LOCATION_URL}/api/provinces.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Location[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return []; // Return an empty array on error
  }
};

export const getRegencies = async (idProvince: string): Promise<Location[]> => {
  try {
    const response = await fetch(
      `${BASE_LOCATION_URL}/api/regencies/${idProvince}.json`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Location[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching regencies:", error);
    return []; // Return an empty array on error
  }
};

export const getDistricts = async (idRegency: string): Promise<Location[]> => {
  try {
    const response = await fetch(
      `${BASE_LOCATION_URL}/api/districts/${idRegency}.json`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Location[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return []; // Return an empty array on error
  }
};

export const getVillages = async (idDistrict: string): Promise<Location[]> => {
  try {
    const response = await fetch(
      `${BASE_LOCATION_URL}/api/villages/${idDistrict}.json`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Location[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching villages:", error);
    return []; // Return an empty array on error
  }
};
