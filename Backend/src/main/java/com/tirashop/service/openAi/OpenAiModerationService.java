package com.tirashop.service.openAi;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.IOException;
import java.util.Set;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OpenAiModerationService {

    private static final Dotenv dotenv = Dotenv.load();
    private static final String API_KEY = dotenv.get("GEMINI_KEY");
    private static final String MODEL_NAME = "gemini-2.5-flash";
    private static final String OBJECT_DETECTION_API_URL = "https://api.api-ninjas.com/v1/objectdetection";
    private static final String OBJECT_DETECTION_API_KEY = dotenv.get("OBJECT_DETECTION_API_KEY");

    public boolean isImageSafe(MultipartFile image) {
        try {
            String url = OBJECT_DETECTION_API_URL;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("X-Api-Key", OBJECT_DETECTION_API_KEY);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new MultipartFileResource(image));

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    String.class);

            if (response.getStatusCode() != HttpStatus.OK) {
                System.out.println(
                        "API returns error with status code: " + response.getStatusCode());
                return false;
            }

            JsonArray detectedObjects = JsonParser.parseString(response.getBody()).getAsJsonArray();

            Set<String> bannedLabels = Set.of(
                    "sex", "sexual", "body", "weapons", "guns", "violence", "racism", "religion",
                    "extremism", "drugs", "hate", "abuse", "waste", "toilet", "naked", "bikini", "bra",
                    "breast", "nipple", "nates", "pussy", "dick", "remote", "scissors", "handbag"
            );

            for (int i = 0; i < detectedObjects.size(); i++) {
                JsonObject detectedObject = detectedObjects.get(i).getAsJsonObject();
                double confidence = detectedObject.get("confidence").getAsDouble();
                String label = detectedObject.get("label").getAsString().toLowerCase();
                if (bannedLabels.contains(label) || confidence < 0.3) {
                    System.out.println("Unsafe Image: Object Detection " + label
                            + " with reliability " + confidence);
                    return false;
                }
            }
            return true;
        } catch (HttpClientErrorException e) {
            System.out.println(
                    "Error HTTP: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return false;
        } catch (IOException e) {
            System.out.println("Error I/O: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.out.println("Error invalid!!!: " + e.getMessage());
            return false;
        }
    }


    public boolean isContentSafe(String text) {
        try {
            String prompt = "Evaluate the following text to determine if it contains any of the following characteristics: \n" +
                    "- Offensive (insulting, derogatory, or disrespectful language)\n" +
                    "- Harmful (promoting violence, hate, or discrimination)\n" +
                    "- Explicit (containing profanity, vulgarity, or sexually suggestive content)\n" +
                    "- Inappropriate (content that is unsuitable for a general audience, including crude or distasteful remarks)\n" +
                    "- Negative (excessively critical, disparaging, or demoralizing comments, especially about products, services, or individuals)\n" +
                    "- Abusive (personal attacks, bullying, or harassment)\n" +
                    "- Exaggerated or inflammatory (overly dramatic or sensationalized negativity that may mislead or provoke)\n" +
                    "The text may be in any language (e.g., English, Vietnamese, Chinese, Spanish). If the text exhibits any of these traits, answer 'NO'. If the text is neutral, positive, or otherwise safe, answer 'YES'. Answer strictly with 'YES' or 'NO':\n" +
                    text;

            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME
                    + ":generateContent?key=" + API_KEY;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            JsonObject requestBody = new JsonObject();
            JsonArray contentsArray = new JsonArray();
            JsonObject contentObject = new JsonObject();
            JsonArray partsArray = new JsonArray();
            JsonObject textObject = new JsonObject();
            textObject.addProperty("text", prompt);
            partsArray.add(textObject);
            contentObject.add("parts", partsArray);
            contentsArray.add(contentObject);
            requestBody.add("contents", contentsArray);

            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<String> requestEntity = new HttpEntity<>(requestBody.toString(), headers);
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, String.class);

            JsonObject responseJson = JsonParser.parseString(response.getBody()).getAsJsonObject();
            if (responseJson.has("candidates")) {
                JsonArray candidates = responseJson.getAsJsonArray("candidates");
                for (int i = 0; i < candidates.size(); i++) {
                    JsonObject candidate = candidates.get(i).getAsJsonObject();
                    if (candidate.has("content")) {
                        JsonArray parts = candidate.getAsJsonObject("content").getAsJsonArray("parts");
                        for (int j = 0; j < parts.size(); j++) {
                            String responseText = parts.get(j).getAsJsonObject().get("text").getAsString().toLowerCase();
                            if (responseText.contains("no")) {
                                System.out.println("Content flagged as unsafe by Gemini AI: " + text);
                                return false;
                            }
                        }
                    }
                }
            }

            return true;

        } catch (Exception e) {
            System.out.println("Error processing content: " + e.getMessage());
            return false;
        }
    }
}
