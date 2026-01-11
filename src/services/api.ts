
export interface Parameter {
    TestCode: string;
    ParameterCode: string;
    ParameterName: string;
    Value: string;
    NormalRange: string;
    ParameterComment: string | null;
    interference: string | null;
    HistoryValue: string;
    HistoryDate: string;
}

export interface Test {
    TestCode: string;
    TestName: string;
    Duration: string;
    Testparameters: Parameter[];
}

export interface Report {
    LabID: string;
    PatientID: string;
    Fullname: string;
    Age: string;
    Gender: string;
    Phone: string;
    Sender: string;
    ClinicalInfo: string;
    SampleOut: string;
    Comment: string;
    TestReqest: Test[];
}

// Mock Data function or Real Fetch
export async function fetchReport(labId: string): Promise<Report | null> {
    try {
        const response = await fetch(`/api/GetAllData/${labId}`);
        if (!response.ok) {
            console.error("API Error");
            return null;
        }
        const data = await response.json();
        // API returns an array, we take the first item
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as Report;
        }
        return null; // Or handle empty/error object
    } catch (error) {
        console.error("Fetch Error:", error);
        return null;
    }
}
