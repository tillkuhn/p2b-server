package net.timafe.angkor.domain

import net.timafe.angkor.config.annotations.EntityTypeInfo
import java.time.LocalDate
import javax.persistence.DiscriminatorValue
import javax.persistence.Entity

/**
 * Entity that represents a Tour,
 * typically backed by an external Komoot URL
 */
@Entity
@DiscriminatorValue("Tour")
@EntityTypeInfo(eventOnCreate = true, eventOnUpdate = false, eventOnDelete = true)
class Tour(

    // Transient fields, will be passed to superclass constructor
    // givenId: UUID? = null,
    tourUrl: String?,

    // Persistent fields which also become part of the superclass table
    // no longer needed: @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = Constants.JACKSON_DATE_FORMAT)
    var beenThere: LocalDate? = null,

    var rating: Int = 0

) : LocatableEntity(primaryUrl = tourUrl)
