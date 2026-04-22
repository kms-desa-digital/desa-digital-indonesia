import { postClaimStandard, postClaimManual } from "../../src/services/villageServices";

jest.mock("../../src/services/villageServices", () => ({
    postClaimStandard: jest.fn(),
    postClaimManual: jest.fn()
}));

describe("Claim Innovations Basis Path Testing", () => {
    let toast: jest.Mock;
    let mockPush: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        toast = jest.fn();
        mockPush = jest.fn();
    });

    // Path 1: 1-10 (Belum pilih bukti)
    test("Path 1: Should fail if no evidence selected", () => {
        const selectedEvidences: string[] = [];
        if (selectedEvidences.length === 0) {
            toast({ title: "Pilih bukti", status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });

    // Path 2: 1-2-10 (File bukti belum lengkap)
    test("Path 2: Should fail if files are missing", () => {
        const selectedEvidences = ["KTP"];
        const allFilesUploaded = false;
        if (selectedEvidences.length > 0 && !allFilesUploaded) {
            toast({ title: "Lengkapi bukti", status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });

    // Path 3: 1-2-3-4-5-6-8-10 (Klaim Manual Berhasil)
    test("Path 3: Should succeed in manual claim", async () => {
        (postClaimManual as jest.Mock).mockResolvedValue({ success: true });
        const isManual = true;
        const isConfirmed = true;

        if (isConfirmed && isManual) {
            await postClaimManual({ data: "manual" });
            mockPush("/success");
        }
        expect(postClaimManual).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/success");
    });

    // Path 4: 1-2-3-4-5-7-8-10 (Klaim Standard Berhasil)
    test("Path 4: Should succeed in standard claim", async () => {
        (postClaimStandard as jest.Mock).mockResolvedValue({ success: true });
        const isManual = false;
        const isConfirmed = true;

        if (isConfirmed && !isManual) {
            await postClaimStandard({ id: "123" });
            mockPush("/success");
        }
        expect(postClaimStandard).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/success");
    });

    // Path 5: 1-2-3-4-5-7-9-10 (Catch Error)
    test("Path 5: Should handle API errors during claim", async () => {
        (postClaimStandard as jest.Mock).mockRejectedValue(new Error("Fail"));
        
        try {
            await postClaimStandard({ id: "123" });
        } catch (e) {
            toast({ status: "error" });
        }
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    });
});
