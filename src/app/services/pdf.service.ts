import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseConfig } from "../base-config";
import { getCurrentDateTime, showWarning } from "../common";
import { getLogisticsApiUrl, getOrdersApiUrl } from "../constants/end-points";
import { getFile } from "@nativescript/core/http";
import { path, File } from "@nativescript/core";
import { TNSFancyAlert } from "@nstudio/nativescript-fancyalert";
import { BaseService } from "./base.service";
import { getString } from "@nativescript/core/application-settings";

@Injectable({
    providedIn: "root"
})
export class PdfService extends BaseService {
    controller: string;
    baseUrl: string;

    constructor(
        http: HttpClient,
        baseConfig: BaseConfig,

    ) {
        super(http, baseConfig);
        this.baseConfig = baseConfig;
        this.baseUrl = getOrdersApiUrl(this.baseConfig.ENV);
    }
    // ReturnEntity

    async downloadIndent(input: any, indentName: string) {
        try {
            console.log("input::", input);
            const url: string = getLogisticsApiUrl(this.baseConfig.ENV) + "/trips/admin/download_indent_sheet";
            const token = getString("auth-token");
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };
            const options = {
                url: url,
                method: "POST",
                headers: headers,
                content: JSON.stringify(input)
            }

            const date = getCurrentDateTime();
            const fileName = `${date}-${indentName}.pdf`;
            const folderPath = path.join(
                android.os.Environment.getExternalStoragePublicDirectory(
                    android.os.Environment.DIRECTORY_DOWNLOADS
                ).toString(),
                "Qwipo"
            );

            const filePath = path.join(folderPath, fileName);
            const response = await getFile(options, filePath);
            console.log("response:", response);
            if (response && response.path) {
                return filePath
            }

        } catch (error) {
            if (error == "Error: java.io.IOException: Permission denied") {
                console.log("else 3")

                TNSFancyAlert.showWarning(
                    "Oya...!",
                    "Please give permission",
                    "Okay"
                );
            } else {
                console.log("else 4")
                return null;
            }
        }
    }

    async downloadInvoice(input: { type: number[], order_numbers: string[] }) {
        try {
            const url: string = `${this.baseUrl}/invoice/download_invoices`;
            const token = getString("auth-token");
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };
            const options = {
                url: url,
                method: "POST",
                headers: headers,
                content: JSON.stringify(input)
            }

            const date = getCurrentDateTime();
            const fileName = `${date}-Invoice.pdf`;
            const folderPath = path.join(
                android.os.Environment.getExternalStoragePublicDirectory(
                    android.os.Environment.DIRECTORY_DOWNLOADS
                ).toString(),
                "Qwipo"
            );
            const filePath = path.join(folderPath, fileName);
            const response = await getFile(options, filePath);
            console.log("response::", response);

            if (response && response.path) {
                return filePath
            }
        } catch (error) {
            if (error == "Error: java.io.IOException: Permission denied") {
                showWarning("Oya...!", "Please give permission", "Okay");
            } else {
                return null;
            }
        }
    }







}
