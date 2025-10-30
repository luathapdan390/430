import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TransformedBelief } from '../types';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const transformBelief = async (limitingBelief: string, yearsToCalculate: number, extraYearsGained: number, hourlyRate: number): Promise<TransformedBelief[]> => {
    const totalHoursGained = 3 * 365 * yearsToCalculate;
    const totalEarnings = totalHoursGained * hourlyRate;

    const prompt = `
        Bạn là một bậc thầy truyền động lực, mang trong mình tinh thần của một chiến binh dũng cảm. Nhiệm vụ của bạn là biến đổi niềm tin giới hạn của người dùng về việc dậy sớm thành những lời khẳng định đanh thép, hùng hồn, đầy can đảm, dựa trên Khuôn khổ 6 Nhu cầu Con người của Tony Robbins.

        Mục tiêu của người dùng là thức dậy lúc 4:30 sáng để đọc sách cùng liên minh câu lạc bộ sách của họ.

        Niềm tin giới hạn của người dùng là: "${limitingBelief}"

        Đây là 6 Nhu cầu Con người và cách định hình các lời khẳng định (viết bằng tiếng Việt với giọng văn mạnh mẽ, can đảm):
        1.  **Certainty (Sự chắc chắn):** Tập trung vào kết quả tất yếu và sức mạnh không thể lay chuyển từ việc dậy sớm. Nhấn mạnh vào việc làm chủ vận mệnh, sức khỏe và thời gian. 
            - Người dùng sẽ có thêm **${extraYearsGained.toFixed(2)} năm** cuộc đời trong **${yearsToCalculate} năm** tới.
            - Với mức thu nhập **$${hourlyRate}/giờ**, khoảng thời gian này tương đương với **$${totalEarnings.toLocaleString('en-US')}**. 
            - **Nhiệm vụ của bạn:** Hãy tính toán và quy đổi số tiền USD này ra Việt Nam Đồng (VND) theo tỷ giá hối đoái mới nhất và lồng ghép tất cả những con số này (số năm có thêm, USD, VND) vào một lời khẳng định hùng hồn về sự chắc chắn và thịnh vượng.
        2.  **Variety (Sự đa dạng):** Mô tả cuộc sống dậy sớm như một cuộc phiêu lưu đầy màu sắc, phá vỡ sự đơn điệu. Đề cập đến những trải nghiệm mới: chinh phục tri thức cùng đồng đội, cảm nhận sự tĩnh lặng của bình minh, khám phá những góc quán cà phê mới, hay kiến tạo nên những dự án thay đổi cuộc đời.
        3.  **Significance (Sự quan trọng):** Khẳng định việc dậy sớm là dấu hiệu của một cá nhân phi thường, một chiến binh có kỷ luật thép, người không đi theo đám đông. Đây là hành động để trở nên khác biệt, để được ngưỡng mộ và là nguồn cảm hứng.
        4.  **Connection (Sự kết nối):** Nhấn mạnh sự kết nối sâu sắc với những người cùng chí hướng trong liên minh. Đồng thời, đây là khoảnh khắc kết nối với bản thể anh hùng bên trong, một sự thấu hiểu và yêu thương chính con người phi thường của mình.
        5.  **Growth (Sự phát triển):** Tuyên bố rằng mỗi buổi sáng sớm là một chiến thắng trong hành trình tôi luyện bản thân. Việc đọc sách và học hỏi không chỉ là phát triển, mà là quá trình tiến hóa, trở thành một phiên bản siêu việt hơn.
        6.  **Contribution (Sự cống hiến):** Giải thích rằng, bằng cách trở thành một phiên bản mạnh mẽ, kỷ luật và trí tuệ hơn, người dùng có thể bảo vệ, che chở và cống hiến nhiều hơn cho gia đình, đội nhóm và xã hội. Sức mạnh của họ sẽ tạo ra giá trị to lớn cho thế giới.

        Dựa trên niềm tin giới hạn của người dùng "${limitingBelief}", hãy tạo ra một mảng JSON các đối tượng. Mỗi đối tượng phải có hai khóa: "need" (tên của nhu cầu, ví dụ: "Certainty") và "text" (lời khẳng định trao quyền cho nhu cầu đó). Ngôn ngữ phải hùng hồn, dũng cảm và bằng tiếng Việt.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            need: { type: Type.STRING },
                            text: { type: Type.STRING },
                        },
                        required: ["need", "text"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);

        const order: string[] = ["Certainty", "Variety", "Significance", "Connection", "Growth", "Contribution"];
        return order.map(need => parsedResponse.find((item: TransformedBelief) => item.need === need) || { need, text: "Không thể tạo nội dung." });

    } catch (error) {
        console.error("Error transforming belief:", error);
        throw new Error("Không thể biến đổi niềm tin. Vui lòng thử lại.");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Hãy đọc với một giọng nam trầm, dũng cảm, rõ ràng và đầy nội lực: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A strong, male voice for courage
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Không thể tạo âm thanh. Vui lòng thử lại.");
    }
};
