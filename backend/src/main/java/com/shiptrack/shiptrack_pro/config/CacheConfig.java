package com.shiptrack.shiptrack_pro.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Analytics Dashboard Module - Redis caching so repeated dashboard loads
 * within the TTL window don't re-run the same aggregation queries.
 *
 * TTL is configurable via analytics.cache-ttl-minutes (default 5).
 *
 * Redis is optional infrastructure in this project.
 * If Redis is unavailable, cache errors are logged and swallowed so that
 * the actual service methods can continue to execute normally.
 */
@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    private static final Logger log =
            LoggerFactory.getLogger(CacheConfig.class);

    @Value("${analytics.cache-ttl-minutes:5}")
    private long cacheTtlMinutes;

    /**
     * Configure Redis cache manager.
     */
    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {

        RedisCacheConfiguration config =
                RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(cacheTtlMinutes))
                        .disableCachingNullValues()
                        .serializeKeysWith(
                                RedisSerializationContext.SerializationPair
                                        .fromSerializer(new StringRedisSerializer())
                        )
                        .serializeValuesWith(
                                RedisSerializationContext.SerializationPair
                                        .fromSerializer(
                                                new GenericJackson2JsonRedisSerializer()
                                        )
                        );

        return builder -> builder.cacheDefaults(config);
    }

    /**
     * Handle Redis cache errors without breaking the application.
     */
    @Override
    public CacheErrorHandler errorHandler() {

        return new CacheErrorHandler() {

            @Override
            public void handleCacheGetError(
                    RuntimeException e,
                    Cache cache,
                    Object key) {

                log.warn(
                        "Redis cache GET failed for cache '{}' key '{}' - " +
                        "proceeding without cache: {}",
                        cache.getName(),
                        key,
                        e.getMessage()
                );
            }

            @Override
            public void handleCachePutError(
                    RuntimeException e,
                    Cache cache,
                    Object key,
                    Object value) {

                log.warn(
                        "Redis cache PUT failed for cache '{}' key '{}' - " +
                        "result not cached: {}",
                        cache.getName(),
                        key,
                        e.getMessage()
                );
            }

            @Override
            public void handleCacheEvictError(
                    RuntimeException e,
                    Cache cache,
                    Object key) {

                log.warn(
                        "Redis cache EVICT failed for cache '{}' key '{}': {}",
                        cache.getName(),
                        key,
                        e.getMessage()
                );
            }

            @Override
            public void handleCacheClearError(
                    RuntimeException e,
                    Cache cache) {

                log.warn(
                        "Redis cache CLEAR failed for cache '{}': {}",
                        cache.getName(),
                        e.getMessage()
                );
            }
        };
    }
}