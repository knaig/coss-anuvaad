package org.anuvaad.filters.pre;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.UUID;

import static org.anuvaad.constants.RequestContextConstants.*;
import org.springframework.stereotype.Component;

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

    private static final String INVALID_ENDPOINT_MSG = "You're trying to access an invalid resource";

    /**
     * Attaches a UUID as correlation id to the request header.
     * @return
     */
    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        final String correlationId = UUID.randomUUID().toString();
        final String requestId = UUID.randomUUID().toString();
        MDC.put(CORRELATION_ID_KEY, correlationId);
        ctx.set(CORRELATION_ID_KEY, correlationId);
        ctx.addZuulRequestHeader(ZUUL_REQUEST_ID_HEADER_KEY, requestId);
        ctx.addZuulRequestHeader(CORRELATION_ID_HEADER_NAME, correlationId);
        return null;
    }


}
