import type { Report } from "../services/api";

export function compilePrompt(template: string, report: Report): string {
    const testResultsText = report.TestReqest.map(test => {
        let text = `\n[TEST: ${test.TestName} (${test.TestCode})]\n`;
        test.Testparameters.forEach(param => {
            text += `- ${param.ParameterName} (${param.ParameterCode}): Result=${param.Value}, Range=${param.NormalRange}, History=${param.HistoryValue || 'None'}\n`;
        });
        return text;
    }).join('\n');

    return template
        .replace(/{{fullname}}/g, report.Fullname)
        .replace(/{{age}}/g, report.Age)
        .replace(/{{gender}}/g, report.Gender)
        .replace(/{{clinical_info}}/g, report.ClinicalInfo || "None provided")
        .replace(/{{test_results}}/g, testResultsText);
}
