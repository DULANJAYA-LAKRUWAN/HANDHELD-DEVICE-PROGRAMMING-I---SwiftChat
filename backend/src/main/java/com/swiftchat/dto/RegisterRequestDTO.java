package com.swiftchat.dto;

import java.io.Serializable;

/**
 * Data Transfer Object for user registration requests.
 */
public class RegisterRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String username;
    private String password;
    private String contactNo;

    public RegisterRequestDTO() {
    }

    public RegisterRequestDTO(String username, String password, String contactNo) {
        this.username = username;
        this.password = password;
        this.contactNo = contactNo;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }
}
