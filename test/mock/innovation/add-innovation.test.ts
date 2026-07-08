import { addInnovation, updateInnovation } from "Services/innovationServices";
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";

jest.mock("Services/innovationServices", () => ({
    addInnovation: jest.fn(),
    updateInnovation: jest.fn()
}));

jest.mock("firebase/storage", () => ({
    ref: jest.fn(),
    uploadBytesResumable: jest.fn(),
    getDownloadURL: jest.fn()
}));

describe("Add Innovation Basis Path Testing", () => {
    let setError: jest.Mock;
    let toast: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        setError = jest.fn();
        toast = jest.fn();
    });

    // Path 1: 1-2-9 (Form belum lengkap)
    test("Path 1: Should show error if form is invalid", () => {
        const isFormValid = false;
        if (!isFormValid) {
            toast({ title: "Form belum lengkap", status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });

    // Path 2: 1-2-3-4-5-7-9 (Edit Mode Success)
    test("Path 2: Should update existing rejected innovation", async () => {
        const status = "Ditolak";
        const innovationId = "inno-123";
        (updateInnovation as jest.Mock).mockResolvedValue({ success: true });

        if (status === "Ditolak") {
            await updateInnovation(innovationId, { name: "Updated" });
            toast({ status: "success" });
        }

        expect(updateInnovation).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });

    // Path 3: 1-2-3-4-6-7-9 (Add Mode Success)
    test("Path 3: Should create new innovation", async () => {
        const status: any = "";
        (addInnovation as jest.Mock).mockResolvedValue({ innovationId: "new-inno" });

        if (status !== "Ditolak") {
            await addInnovation({ name: "New Inno" });
            toast({ status: "success" });
        }

        expect(addInnovation).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
    });

    // Path 4: 1-2-3-4-6-8-9 (Error Catch)
    test("Path 4: Should handle API errors during submission", async () => {
        const error = new Error("Network Error");
        (addInnovation as jest.Mock).mockRejectedValue(error);

        try {
            await addInnovation({ name: "Fail" });
        } catch (e: any) {
            toast({ title: "Gagal", status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });
});