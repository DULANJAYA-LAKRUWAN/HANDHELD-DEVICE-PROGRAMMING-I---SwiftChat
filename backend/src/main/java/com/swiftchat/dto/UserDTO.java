package com.swiftchat.dto;

import com.swiftchat.entity.User;

import java.io.Serializable;
import java.util.Date;

/**
 * Data Transfer Object representing safe public user details.
 * Prevents exposing password hashes or internal JPA proxy structures.
 */
public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String contactNo;
    private Date createdAt;

    public UserDTO() {
    }

    public UserDTO(Long id, String username, String contactNo, Date createdAt) {
        this.id = id;
        this.username = username;
        this.contactNo = contactNo;
        this.createdAt = createdAt;
    }

    /**
     * Converts a JPA User entity to a clean UserDTO.
     *
     * @param user source User entity
     * @return UserDTO instance, or null if entity is null
     */
    public static UserDTO fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getContactNo(),
                user.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
