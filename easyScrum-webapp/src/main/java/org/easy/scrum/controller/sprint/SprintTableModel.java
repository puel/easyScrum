/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.easy.scrum.controller.sprint;

import java.util.Collections;
import java.util.List;
import javax.enterprise.context.SessionScoped;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;
import org.easy.jsf.table.AbstractTableModel;
import org.easy.scrum.controller.day.DailyController;
import org.easy.scrum.model.SprintBE;
import org.easy.scrum.model.SprintDayBE;
import org.easy.scrum.model.TeamBE;
import org.easy.scrum.service.SprintBF;
import org.joda.time.LocalDate;
import org.joda.time.Period;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Named("sprintTableModel")
@SessionScoped
public class SprintTableModel extends AbstractTableModel<SprintBE, SprintBF> {
    private static final Logger LOG = LoggerFactory.getLogger(SprintTableModel.class);
    
    @Inject
    private SprintBF sprintBF;
            
    protected TeamBE team;

    public SprintTableModel() {
        super();
    }
    
    @Override
    protected SprintBE newModel() {
        SprintBE result = new SprintBE();
        result.setTeam(team);
        LOG.debug("new sprint with team {]", team);
        if (!this.elements.isEmpty()) {
            result.setStart(
                new LocalDate(this.elements.get(0).getEnd()).plusDays(1).toDate());
            result.newEndDate(Period.weeks(2));
        }
        return result;
    }
    
    public void copy(SprintBE sprint) {
        logger.debug("copy -> {}", sprint);
        this.newElement = new SprintBE(sprint);
    }

    @Override
    protected List<SprintBE> findAll() {
        List<SprintBE> result = Collections.emptyList();
        if (team != null) result = sprintBF.findSprintByTeamId(team.getId());
        return result;
    }

    public TeamBE getTeam() {
        return team;
    }

    public void setTeam(TeamBE team) {
        this.team = team;
    }

    @Override
    protected SprintBF getFacade() {
        return sprintBF;
    }
}
