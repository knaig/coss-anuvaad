package org.anuvaad.filters.pre;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import static org.anuvaad.constants.RequestContextConstants.CORRELATION_ID_KEY;

import java.util.UUID;

/**
 * 1st filter to execute in the request flow.
 * Adds a unique correlation id to every request in the header.
 * This can be treated as a unique request id per request for request tracing purposes.
 *
 */
@Component
public class CorrelationFilter extends ZuulFilter {

    private static final String RECEIVED_REQUEST_MESSAGE = "Received request for: {}";

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    @Override
    public String filterType() {
        return "pre";
    }

    @Override
    public int filterOrder() {
        return 0;
    } // First filter

    @Override
    public boolean shouldFilter() {
        return true;
    }

    /**
     * Attaches a UUID as correlation id to the request header.
     * @return
     */
    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        final String correlationId = UUID.randomUUID().toString();
        MDC.put(CORRELATION_ID_KEY, correlationId);
        ctx.set(CORRELATION_ID_KEY, correlationId);
        logger.debug(RECEIVED_REQUEST_MESSAGE, ctx.getRequest().getRequestURI());
        return null;
    }

}
