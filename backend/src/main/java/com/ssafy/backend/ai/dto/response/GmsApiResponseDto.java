package com.ssafy.backend.ai.dto.response;

import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GmsApiResponseDto {
    private List<Choice> choices;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Choice {
        private Message message;

        @Getter
        @Setter
        @NoArgsConstructor
        public static class Message {
            private String content;
        }
    }
}
