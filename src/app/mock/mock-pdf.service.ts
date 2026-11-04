import { Injectable } from "@angular/core";
import { showWarning } from "../common";

// Stands in for PdfService in mock mode. Invoice / indent PDFs are rendered by the live orders service and
// downloaded with NativeScript's getFile (outside HttpClient), so the interceptor can't serve them.
@Injectable()
export class MockPdfService {
    async downloadIndent(input: any, indentName?: string): Promise<string | null> {
        return this.unavailable(indentName || "Indent");
    }

    async downloadInvoice(input: any): Promise<string | null> {
        return this.unavailable("Invoice");
    }

    private unavailable(what: string): never {
        console.log(`[MOCK] ${what} PDF download skipped`);
        showWarning("Mock mode", `${what} PDFs come from the live orders service, so they can't be downloaded in this mock build.`, "Okay");
        throw new Error("PDF downloads are disabled in mock mode");
    }
}
