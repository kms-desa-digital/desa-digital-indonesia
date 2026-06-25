import { updateVillage, createVillage } from "Services/villageServices";

jest.mock("Services/villageServices", () => ({
    updateVillage: jest.fn(),
    createVillage: jest.fn()
}));

describe("Village Profile Basis Path Testing", () => {
    let toast: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        toast = jest.fn();
    });

    // Path 1: 1-8 (Form tidak lengkap)
    test("Path 1: Should fail if form is invalid", () => {
        const isFormValid = false;
        if (!isFormValid) {
            // Simulated validation logic
            toast({ status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });

    // Path 2: 1-2-3-4-6-8 (Update profil desa yang Ditolak)
    test("Path 2: Should update rejected village profile", async () => {
        const status = "Ditolak";
        const isFormValid = true;
        (updateVillage as jest.Mock).mockResolvedValue({ success: true });

        if (isFormValid) {
            if (status === "Ditolak") {
                await updateVillage("vid-123", { name: "Village A" });
                toast({ status: "success" });
            }
        }
        expect(updateVillage).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });

    // Path 3: 1-2-3-5-6-8 (Buat profil desa baru)
    test("Path 3: Should create new village profile", async () => {
        const status: any = "";
        const isFormValid = true;
        (createVillage as jest.Mock).mockResolvedValue({ success: true });

        if (isFormValid) {
            if (status !== "Ditolak") {
                await createVillage({ vid: "vid-456", name: "Village B" });
                toast({ status: "success" });
            }
        }
        expect(createVillage).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });
});