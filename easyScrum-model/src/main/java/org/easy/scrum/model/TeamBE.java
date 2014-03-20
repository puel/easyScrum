package org.easy.scrum.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.easy.validation.html.SafeHtml;

@Entity
@Table(name = "TEAM")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TeamBE extends AbstractEntity {
    private static final long serialVersionUID = 1L;
    
    @NotNull
    @Size(min = 1, max = 255)
    @Column(length = 255)
    @SafeHtml
    private String name;

    @OneToMany(cascade = {}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "team")
    @JsonIgnore
    private List<SprintBE> sprints = new ArrayList<SprintBE>();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<SprintBE> getSprints() {
        return sprints;
    }

    public void setSprints(List<SprintBE> sprints) {
        this.sprints = sprints;
    }
    
    @Override
    public String toString() {
        ToStringBuilder builder = new ToStringBuilder(this);
        builder.append("id", getId());
        builder.append("name", name);
        return builder.toString();
    }
}
