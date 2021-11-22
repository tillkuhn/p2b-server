package net.timafe.angkor.domain

import net.timafe.angkor.config.annotations.EntityTypeInfo
import javax.persistence.DiscriminatorValue
import javax.persistence.Entity

/**
 * Entity that represents a Blog Post,
 * typically backed by an external WordPress URL
*/
@Entity
@DiscriminatorValue("Post")
@EntityTypeInfo(eventOnCreate = true, eventOnUpdate = false, eventOnDelete = true)
class Post : LocatableEntity()
