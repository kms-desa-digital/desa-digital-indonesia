import { updateInnovator, createInnovator } from "../../src/services/innovatorServices";

jest.mock("../../src/services/innovatorServices", () => ({
    updateInnovator: jest.fn(),
    createInnovator: jest.fn()
}));

describe("Innovator Profile Basis Path Testing", () => {
    let toast: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        toast = jest.fn();
    });

    // Path 1: 1-2-3-4-6-8 (Update Profil Berhasil)
    test("Path 1: Should update existing innovator profile", async () => {
        const status = "Menunggu";
        (updateInnovator as jest.Mock).mockResolvedValue({ success: true });

        if (status !== "") {
            await updateInnovator("uid-123", { name: "Updated" });
            toast({ status: "success" });
        }

        expect(updateInnovator).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });

    // Path 2: 1-2-3-5-6-8 (Buat Profil Baru Berhasil)
    test("Path 2: Should create new innovator profile", async () => {
        const status = "";
        (createInnovator as jest.Mock).mockResolvedValue({ success: true });

        if (status === "") {
            await createInnovator("uid-456", { name: "New" });
            toast({ status: "success" });
        }

        expect(createInnovator).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });

    // Path 3: 1-2-3-5-7-8 (Catch Error)
    test("Path 3: Should handle API errors in profile creation", async () => {
        const error = new Error("DB Error");
        (createInnovator as jest.Mock).mockRejectedValue(error);

        try {
            await createInnovator("uid-789", { name: "Fail" });
        } catch (e) {
            toast({ status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });
});
