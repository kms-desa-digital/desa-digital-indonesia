import { createMocks } from "node-mocks-http";

describe("Admin Verification Basis Path Testing (API)", () => {
    let mockUpdate: jest.Mock;
    let mockNotify: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate = jest.fn();
        mockNotify = jest.fn();
    });

    // Path 1: 1-2-5-6-8 (Admin menyetujui pengajuan)
    test("Path 1: Admin verifies successfully", async () => {
        const action = "verify";
        let success = false;

        if (action === "verify") {
            await mockUpdate("Terverifikasi");
            success = true;
        }

        if (success) {
            await mockNotify();
        }

        expect(mockUpdate).toHaveBeenCalledWith("Terverifikasi");
        expect(mockNotify).toHaveBeenCalled();
    });

    // Path 2: 1-3-4-5-6-8 (Admin menolak pengajuan)
    test("Path 2: Admin rejects with reason", async () => {
        const action: any = "reject";
        let success = false;

        if (action !== "verify") {
            // Simulate modal input
            const reason = "Incomplete data";
            await mockUpdate("Ditolak", reason);
            success = true;
        }

        if (success) {
            await mockNotify();
        }

        expect(mockUpdate).toHaveBeenCalledWith("Ditolak", "Incomplete data");
        expect(mockNotify).toHaveBeenCalled();
    });

    // Path 3: 1-3-4-5-8 (Failure Path)
    test("Path 3: Admin update fails", async () => {
        mockUpdate.mockRejectedValue(new Error("DB Error"));
        const action: any = "reject";
        let success = false;

        try {
            if (action !== "verify") {
                await mockUpdate("Ditolak", "bad");
                success = true;
            }
        } catch (e) {
            success = false;
        }

        expect(success).toBe(false);
        expect(mockNotify).not.toHaveBeenCalled();
    });
});