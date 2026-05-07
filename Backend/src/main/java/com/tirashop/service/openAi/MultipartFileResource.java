package com.tirashop.service.openAi;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public class MultipartFileResource extends ByteArrayResource {

    private final MultipartFile multipartFile;

    public MultipartFileResource(MultipartFile multipartFile) throws IOException {
        super(multipartFile.getBytes());
        this.multipartFile = multipartFile;
    }

    @Override
    public String getFilename() {
        return multipartFile.getOriginalFilename();
    }
}
